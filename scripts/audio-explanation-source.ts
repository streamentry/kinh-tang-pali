import {
  allExplanationNarrationSources,
  explanationNarrationSource,
  EXPLANATION_AUDIO_AUDIENCES,
  type ExplanationAudioCollection,
  type ExplanationAudioAudience,
} from '../src/lib/canon/explanation-audio';

const args = process.argv.slice(2);
if (args[0] === '--all' && (args.length === 1 || args.length === 2)) {
  const collection = (args[1] ?? 'mn') as ExplanationAudioCollection;
  if (collection !== 'mn' && collection !== 'dn') throw new Error(`Unsupported explanation collection: ${collection}`);
  process.stdout.write(`${JSON.stringify(allExplanationNarrationSources(collection))}\n`);
} else if (args.length === 2 && EXPLANATION_AUDIO_AUDIENCES.includes(args[1] as ExplanationAudioAudience)) {
  process.stdout.write(`${JSON.stringify(explanationNarrationSource(args[0], args[1] as ExplanationAudioAudience))}\n`);
} else if (args.length === 3 && (args[0] === 'mn' || args[0] === 'dn')
  && EXPLANATION_AUDIO_AUDIENCES.includes(args[2] as ExplanationAudioAudience)) {
  process.stdout.write(`${JSON.stringify(explanationNarrationSource(args[1], args[2] as ExplanationAudioAudience, args[0]))}\n`);
} else {
  throw new Error('Usage: node --import tsx scripts/audio-explanation-source.ts <mn1..mn152> <audience> | dn <dn1..dn34> <audience> | --all [mn|dn]');
}
