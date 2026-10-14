// 録画を mp4 に変換し、置き場の README を書き直す。対象のリポジトリへ写して使う。ffmpeg と ffprobe が要る。
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CURSOR_LEGEND } from './cursor';

/** 字幕を出した時刻(録画のコンテキストでページを開いてからの秒)と、そのときに撮った静止画 */
export type CaptionAt = { at: number; text: string; frame?: string };

type Done = {
  name: string;
  header: string;
  captions: CaptionAt[];
  /** ページを開いてから操作を終えるまでの秒 */
  elapsed: number;
  failure?: string;
  codec?: string;
  seconds?: number;
};

const run = (cmd: string, args: string[]): string => {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') throw new Error(`${cmd} が無い。ffmpeg と ffprobe を入れる`);
    throw new Error(`${cmd} が失敗した: ${String(e)}`);
  }
};

const clock = (sec: number): string => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

/**
 * webm/<name>.webm を、QuickTime とホスティングサービスで再生できる H.264 の mp4/<name>.mp4 に変換し、
 * 撮った記録を webm/<name>.json に残して README.md を書き直す。出力先は convert-captures.sh と同じである。
 */
export const finishEvidence = (dir: string, take: Omit<Done, 'codec' | 'seconds'>): void => {
  const webm = path.join(dir, 'webm', `${take.name}.webm`);
  mkdirSync(path.join(dir, 'mp4'), { recursive: true });
  const mp4 = path.join(dir, 'mp4', `${take.name}.mp4`);
  run('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
  const probe = JSON.parse(
    run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name:format=duration', '-of', 'json', mp4]),
  ) as { streams: { codec_name: string }[]; format: { duration: string } };
  const done: Done = { ...take, codec: probe.streams[0]?.codec_name, seconds: Number(probe.format.duration) };
  writeFileSync(path.join(dir, 'webm', `${take.name}.json`), JSON.stringify(done, null, 2));
  writeReadme(dir);
};

/** 置き場の README を、webm/ にある撮った記録の全部から書き直す。同じ名前で撮り直しても、節が重ならない */
const writeReadme = (dir: string): void => {
  const takes = readdirSync(path.join(dir, 'webm'))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(path.join(dir, 'webm', f), 'utf8')) as Done);
  const sections = takes.map((t) => {
    // 録画はページを開いた直後の何も描いていない間を持たないので、動画の尺は操作の時間より短い。差を引いて動画の時刻にする
    const lag = Math.max(0, t.elapsed - (t.seconds ?? t.elapsed));
    const lines = t.captions.map((c) => `| ${clock(Math.max(0, c.at - lag))} | ${c.text.replaceAll('|', '\\|').replaceAll('\n', '<br>')} | ${c.frame ?? ''} |`);
    return [
      `## mp4/${t.name}.mp4`,
      '',
      `${t.codec}、${t.seconds?.toFixed(1)} 秒。字幕の 1 段目は「${t.header}」。`,
      ...(t.failure ? ['', `**撮影が途中で失敗した**: ${t.failure}`] : []),
      '',
      '| 時刻 | 字幕 | 静止画 |',
      '| --- | --- | --- |',
      ...lines,
    ].join('\n');
  });
  const readme = [
    `# ${path.basename(dir)}`,
    '',
    '時刻は字幕を出した動画の時刻で、1 秒ほどずれることがある。静止画は、判定の字幕を出し終えた時点の画面である。',
    `動画の上端の字幕は、1 段目がどの証跡かと${CURSOR_LEGEND.replace('カーソル: ', 'カーソルの凡例(')})、2 段目から下が手順と判定の文である。`,
    '',
    sections.join('\n\n'),
    '',
  ].join('\n');
  writeFileSync(path.join(dir, 'README.md'), readme);
};
