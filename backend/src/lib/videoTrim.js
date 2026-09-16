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
      if (st.size >= 512) {
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

    // Accurate re-encode fallback (still seconds for ≤60s clips).
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
    if (st2.size < 512) {
      throw new Error("El clip recortado quedó vacío");
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

/**
 * True when the client asked for a window that is not the whole file.
 */
function shouldTrimClip(startSec, durationSec, probedDurationSec) {
  const start = Number(startSec);
  const dur = Number(durationSec);
  if (!Number.isFinite(start) || !Number.isFinite(dur) || dur <= 0) {
    return false;
  }
  if (start > 0.08) return true;
  if (
    Number.isFinite(probedDurationSec) &&
    probedDurationSec > 0 &&
    dur < probedDurationSec - 0.25
  ) {
    return true;
  }
  // Client reported a clip window without a reliable probe — still trim if start/dur given.
  if (start >= 0 && dur > 0 && dur <= 60.05) {
    // Only force trim when start > 0 or explicit clip shorter than a "full short" file.
    // probed null + start≈0 + dur≤60: may be full file already ≤60s — skip.
    return start > 0.08;
  }
  return false;
}

module.exports = {
  ensureFfmpegPaths,
  trimVideoBuffer,
  shouldTrimClip,
};
