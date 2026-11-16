import {
  allMNExplanationNarrationSources,
  explanationNarrationSource,
  EXPLANATION_AUDIO_AUDIENCES,
  type ExplanationAudioAudience,
} from '../src/lib/canon/explanation-audio';

const args = process.argv.slice(2);
if (args[0] === '--all' && args.length === 1) {
  process.stdout.write(`${JSON.stringify(allMNExplanationNarrationSources())}\n`);
} else if (args.length === 2 && EXPLANATION_AUDIO_AUDIENCES.includes(args[1] as ExplanationAudioAudience)) {
  process.stdout.write(`${JSON.stringify(explanationNarrationSource(args[0], args[1] as ExplanationAudioAudience))}\n`);
} else {
  throw new Error('Usage: node --import tsx scripts/audio-explanation-source.ts <mn1..mn152> <children|adults|older-adults> | --all');
}
