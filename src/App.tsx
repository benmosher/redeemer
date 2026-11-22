import React, { useCallback, useEffect, useRef } from "react";
import { useImmer } from "use-immer";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";

// https://marvel.bb.io/c/AWZRXTHAEY
const REDEEM_BASE = "https://www.marvelcomicsapp.com/redeem?code=";
// The redeem page rejects more than this many codes per submission.
const MAX_BATCH = 10;

function createBeep(): () => void {
  let audioCtx: AudioContext | null = null;
  return () => {
    if (!audioCtx) audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 1800;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  };
}

const beep = createBeep();

function stripCode(url: string): string {
  const finalSlash = url.lastIndexOf("/");
  return url.substring(finalSlash + 1);
}

const HINTS = new Map<DecodeHintType, any>([[DecodeHintType.TRY_HARDER, true]]);

// Prefer the rear camera at higher resolution so damaged/small codes have
// enough pixel density for zxing to lock on.
const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
};

export default function App() {
  const [data, setData] = useImmer<string[]>([]);
  const [batches, setBatches] = useImmer<string[][]>([]);

  // Scanner callbacks are bound once, so read batches through a ref to
  // skip codes that were already sent for redemption.
  const batchesRef = useRef(batches);
  batchesRef.current = batches;

  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    async function startScanner() {
      const codeReader = new BrowserQRCodeReader(HINTS, {
        delayBetweenScanAttempts: 100,
        delayBetweenScanSuccess: 500,
      });

      const previewElem = document.querySelector(
        "#test-area-qr-code-webcam > video"
      ) as HTMLVideoElement;

      controlsRef.current = await codeReader.decodeFromConstraints(
        VIDEO_CONSTRAINTS,
        previewElem,
        (result, error) => {
          if (result) {
            const text = stripCode(result.getText());
            setData((draft) => {
              if (
                !draft.includes(text) &&
                !batchesRef.current.some((batch) => batch.includes(text))
              ) {
                draft.push(text);
                beep();
                document.body.classList.add("scan-flash");
                setTimeout(() => document.body.classList.remove("scan-flash"), 400);
              }
            });
          }
        }
      );
    }
    startScanner();

    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  // Pause/resume scanner when page visibility changes (e.g. iOS PWA popover)
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        controlsRef.current?.stop();
        controlsRef.current = null;
      } else {
        // Restart scanner when page becomes visible again
        const codeReader = new BrowserQRCodeReader(HINTS, {
          delayBetweenScanAttempts: 100,
          delayBetweenScanSuccess: 500,
        });
        const previewElem = document.querySelector(
          "#test-area-qr-code-webcam > video"
        ) as HTMLVideoElement;

        codeReader
          .decodeFromConstraints(VIDEO_CONSTRAINTS, previewElem, (result, error) => {
            if (result) {
              const text = stripCode(result.getText());
              setData((draft) => {
                if (
                  !draft.includes(text) &&
                  !batchesRef.current.some((batch) => batch.includes(text))
                ) {
                  draft.push(text);
                  beep();
                  document.body.classList.add("scan-flash");
                  setTimeout(
                    () => document.body.classList.remove("scan-flash"),
                    400
                  );
                }
              });
            }
          })
          .then((controls) => {
            controlsRef.current = controls;
          });
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const handleRedeem = useCallback(() => {
    // No-op if no codes
    if (data.length === 0) {
      return;
    }

    const batch = data.slice(0, MAX_BATCH);
    window.open(REDEEM_BASE + batch.join(","), "_blank");

    // capture the batch and leave the remainder pending for the next press
    setBatches((draft) => {
      draft.push(batch);
    });
    setData(data.slice(MAX_BATCH));
  }, [data]);

  const nextBatchSize = Math.min(data.length, MAX_BATCH);
  const remaining = data.length - nextBatchSize;
  const batchesToGo = Math.ceil(data.length / MAX_BATCH);

  return (
    <>
      <section>
        <button onClick={handleRedeem} disabled={data.length === 0}>
          REDEEM{nextBatchSize > 0 && ` ${nextBatchSize}`}
          {remaining > 0 && ` (${remaining} left)`}
        </button>
      </section>
      <section>
        Scanned {data.length} codes
        {batchesToGo > 1 && `, ${batchesToGo} batches to go`}. Latest: {data[data.length - 1] ?? "(none)"}
      </section>
      <details id="test-area-qr-code-webcam" open>
        <summary>Camera Preview</summary>
        <video style={{ width: "100%" }}></video>
      </details>
      <details>
        <summary>Previous Scans</summary>
        <ul>
          {batches.map((batch, index) => (
            <li key={index}>
              {batch.join(", ")} (
              <a href={REDEEM_BASE + batch.join(",")} target="_blank">
                retry
              </a>
              )
            </li>
          ))}
        </ul>
        <button onClick={() => setBatches([])} disabled={batches.length === 0}>
          Clear
        </button>
      </details>
    </>
  );
}
