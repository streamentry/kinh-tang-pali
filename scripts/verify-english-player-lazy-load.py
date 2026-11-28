#!/usr/bin/env python3
"""Verify the production English-unavailable state and lazy media loading.

Run only after the player PR is merged and its Pages deployment succeeds. This
is a no-audio smoke check: every media request is intercepted and aborted before
transfer. It does not prove English playback, seeking, or spoken-content quality.
Use the repository's pinned player-venv and installed Google Chrome.
"""
import argparse
import asyncio
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from playwright.async_api import async_playwright

DEFAULT_BASE = 'https://streamentry.github.io/kinh-tang-pali'
DEFAULT_OUTPUT = Path('/private/tmp/english-player-lazy-load-production.json')
STORAGE_KEY = 'kinh-tang-pali:audio:version:v1'


def is_audio(url: str) -> bool:
    return url.split('?', 1)[0].lower().endswith(('.mp3', '.wav', '.m4a', '.ogg', '.flac'))


async def run_case(browser, *, base: str, name: str, path: str, saved_english: bool,
                   collection: bool, click_play: bool = False):
    context = await browser.new_context(viewport={'width': 1440, 'height': 1000})
    if saved_english:
        await context.add_init_script(f"localStorage.setItem('{STORAGE_KEY}', 'english-standard')")
    page = await context.new_page()
    attempts = []

    async def route_request(route, request):
        if is_audio(request.url):
            attempts.append({
                'url': request.url,
                'method': request.method,
                'resource_type': request.resource_type,
                'range': request.headers.get('range'),
                'aborted_before_network': True,
            })
            await route.abort()
        else:
            await route.continue_()

    await page.route('**/*', route_request)
    selector = 'sutta-playlist' if collection else 'sutta-audio'
    response = await page.goto(base + path, wait_until='domcontentloaded', timeout=60000)
    await page.wait_for_function(
        '(selector) => document.querySelector(selector)?.dataset.ready === "true"',
        arg=selector,
        timeout=30000,
    )
    await page.wait_for_timeout(2000)
    before = list(attempts)
    state = await page.evaluate("""({selector}) => {
      const player = document.querySelector(selector);
      const audio = player?.querySelector('audio');
      const select = player?.querySelector('[data-version-select]');
      const english = [...(select?.options ?? [])].find(o => o.value === 'english-standard');
      const play = player?.querySelector('.listen-play');
      return {
        ready: player?.dataset.ready === 'true',
        selected_version: select?.value ?? null,
        english_disabled: english?.disabled ?? null,
        paused: audio?.paused ?? null,
        preload: audio?.preload ?? null,
        play_disabled: play?.disabled ?? null,
        scroll_width: document.documentElement.scrollWidth,
        client_width: document.documentElement.clientWidth,
      };
    }""", {'selector': selector})
    result = {
        'case': name,
        'url': page.url,
        'http_status': response.status if response else None,
        'state': state,
        'audio_requests_before_interaction': before,
    }
    if click_play:
        await page.locator(f'{selector} .listen-play').click()
        await page.wait_for_timeout(1200)
        result['audio_requests_after_explicit_play'] = list(attempts[len(before):])
    if name.endswith('mobile'):
        await page.set_viewport_size({'width': 390, 'height': 844})
        result['mobile'] = await page.evaluate(
            '({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth})'
        )
    await context.close()
    return result


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--pages-run-id', required=True, type=int)
    parser.add_argument('--merge-sha', required=True)
    parser.add_argument('--base-url', default=DEFAULT_BASE)
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    if args.pages_run_id <= 0 or not re.fullmatch(r'[0-9a-f]{40}', args.merge_sha):
        parser.error('--pages-run-id must be positive and --merge-sha must be a full Git SHA')
    base = args.base_url.rstrip('/')
    report = {
        'recorded_at': datetime.now(timezone.utc).isoformat(),
        'production_origin': base,
        'expected_pages_run_id': args.pages_run_id,
        'pages_merge_commit': args.merge_sha,
        'served_build_identity': 'not inferred from Pages run',
        'browser': 'installed Google Chrome via pinned repository player-venv Playwright',
        'audio_request_policy': 'All audio requests are intercepted and aborted before network transfer.',
        'tts_calls': 0,
        'r2_writes': 0,
        'human_listening': 'pending',
        'cases': [],
    }
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='chrome', headless=True)
        report['cases'].append(await run_case(
            browser, base=base, name='text-default', path='/sutta/mn/mn1/',
            saved_english=False, collection=False, click_play=True,
        ))
        report['cases'].append(await run_case(
            browser, base=base, name='text-saved-english-unavailable', path='/sutta/mn/mn1/',
            saved_english=True, collection=False,
        ))
        report['cases'].append(await run_case(
            browser, base=base, name='collection-saved-english-incomplete-mobile', path='/sutta/mn/',
            saved_english=True, collection=True,
        ))
        await browser.close()

    assertions = {
        'all_pages_http_200': all(case['http_status'] == 200 for case in report['cases']),
        'no_audio_requests_before_interaction': all(not case['audio_requests_before_interaction'] for case in report['cases']),
        'default_starts_paused': report['cases'][0]['state']['paused'] is True,
        'saved_english_text_stops_without_fallback': report['cases'][1]['state']['selected_version'] == 'english-standard'
            and report['cases'][1]['state']['paused'] is True and report['cases'][1]['state']['play_disabled'] is True,
        'english_group_disabled_when_incomplete': report['cases'][2]['state']['english_disabled'] is True,
        'tap_attempts_media_request': bool(report['cases'][0].get('audio_requests_after_explicit_play')),
        'mobile_no_overflow': report['cases'][2].get('mobile', {}).get('scroll', 0)
            <= report['cases'][2].get('mobile', {}).get('width', 0),
    }
    report['assertions'] = assertions
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))
    if not all(assertions.values()):
        raise SystemExit(f'Production lazy-load verification failed: {assertions}; report={args.output}')
    print(f'PASS: {args.output}')


if __name__ == '__main__':
    asyncio.run(main())
