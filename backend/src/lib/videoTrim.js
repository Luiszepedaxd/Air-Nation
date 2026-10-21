const fs = require("fs");
const os = require("os");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

let pathsConfigured = false;

function ensureFfmpegPaths() {
  if (pathsConfigured) return;
  try {
    const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
    if (ffmpegInstaller && ffmpegInstaller.path) {
      ffmpeg.setFfmpegPath(ffmpegInstaller.path);
    }
  } catch (_) {
    /* system ffmpeg may still be available */
  }
  try {
    const ffprobeInstaller = require("@ffprobe-installer/ffprobe");
    if (ffprobeInstaller && ffprobeInstaller.path) {
      ffmpeg.setFfprobePath(ffprobeInstaller.path);
    }
  } catch (_) {
    /* system ffprobe may still be available */
  }
  pathsConfigured = true;
}

function runFfmpeg(inputPath, outputPath, outputOptions, inputOptions) {
  return new Promise((resolve, reject) => {
    const cmd = ffmpeg(inputPath);
    if (inputOptions && inputOptions.length) {
      cmd.inputOptions(inputOptions);
    }
    cmd
      .outputOptions(outputOptions)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
}

/**
 * true / false si ffprobe pudo leer el archivo; null si no hay probe
 * (no bloquear el upload por un ffprobe caído).
 * Un -c copy puede salir en 0 habiendo tirado el video.
 */
function outputHasVideo(filePath) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err || !data || !Array.isArray(data.streams)) return resolve(null);
      resolve(
        data.streams.some(
          (s) =>
            s.codec_type === "video" &&
            !(s.disposition && s.disposition.attached_pic)
        )
      );
    });
  });
}

/**
 * Cut a clip with ffmpeg. Prefer stream-copy (seconds); fall back to H.264/AAC.
 * @returns {Promise<{ buffer: Buffer, mimetype: string, filename: string }>}
 */
async function trimVideoBuffer(buffer, originalname, startSec, durationSec) {
  ensureFfmpegPaths();

  const start = Math.max(0, Number(startSec) || 0);
  const duration = Math.max(0.1, Number(durationSec) || 0);
  const srcExt = path.extname(originalname || "") || ".mp4";
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const inputPath = path.join(os.tmpdir(), `airnation-in-${id}${srcExt}`);
  const copyPath = path.join(os.tmpdir(), `airnation-copy-${id}.mp4`);
  const encPath = path.join(os.tmpdir(), `airnation-enc-${id}.mp4`);

  await fs.promises.writeFile(inputPath, buffer);

  const cleanup = async () => {
    await Promise.all(
      [inputPath, copyPath, encPath].map((p) =>
        fs.promises.unlink(p).catch(() => {})
      )
    );
  };

  try {
    // Input seek + stream copy: fast for phone MP4/MOV.
    try {
      await runFfmpeg(
        inputPath,
        copyPath,
        [
          "-t",
          String(duration),
          "-c",
          "copy",
          "-movflags",
          "+faststart",
          "-avoid_negative_ts",
          "make_zero",
        ],
        [`-ss`, String(start)]
      );
      const st = await fs.promises.stat(copyPath);
      const copyHasVideo = await outputHasVideo(copyPath);
      if (st.size >= 512 && copyHasVideo !== false) {
        const out = await fs.promises.readFile(copyPath);
        return {
          buffer: out,
          mimetype: "video/mp4",
          filename: "clip.mp4",
        };
      }
    } catch (copyErr) {
      console.warn(
        "[videoTrim] stream-copy failed, re-encoding:",
        copyErr && copyErr.message ? copyErr.message : copyErr
      );
    }

    // Accurate re-encode fallback (tens of seconds for a ≤180s clip).
    await runFfmpeg(
      inputPath,
      encPath,
      [
        "-t",
        String(duration),
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
      ],
      [`-ss`, String(start)]
    );
    const st2 = await fs.promises.stat(encPath);
    const encHasVideo = await outputHasVideo(encPath);
    if (st2.size < 512 || encHasVideo === false) {
      throw new Error("El archivo no tiene pista de video");
    }
    const out2 = await fs.promises.readFile(encPath);
    return {
      buffer: out2,
      mimetype: "video/mp4",
      filename: "clip.mp4",
    };
  } finally {
    await cleanup();
  }
}

module.exports = {
  ensureFfmpegPaths,
  trimVideoBuffer,
};
