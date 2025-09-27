import React, { useCallback, useEffect } from "react";
import { useImmer } from "use-immer";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";

// https://marvel.bb.io/c/AWZRXTHAEY
const REDEEM_BASE = "https://www.marvel.com/redeem?redeemcode=";

function stripCode(url: string): string {
  const finalSlash = url.lastIndexOf("/");
  return url.substring(finalSlash + 1);
}

const HINTS = new Map<DecodeHintType, any>([[DecodeHintType.TRY_HARDER, true]]);

export default function App() {
  const [data, setData] = useImmer<string[]>([]);
  const [batches, setBatches] = useImmer<string[][]>([]);

  useEffect(() => {
    let controls: IScannerControls;

    async function startScanner() {
      const codeReader = new BrowserQRCodeReader(HINTS, {
        delayBetweenScanAttempts: 100,
        delayBetweenScanSuccess: 500,
      });

      const previewElem = document.querySelector(
        "#test-area-qr-code-webcam > video"
      ) as HTMLVideoElement;

      controls = await codeReader.decodeFromVideoDevice(
        undefined,
        previewElem,
        (result, error) => {
          if (result) {
            const text = stripCode(result.getText());
            setData((draft) => {
              if (!draft.includes(text)) {
                draft.push(text);
                navigator.vibrate?.([100, 100, 300]);
              }
            });
          }
        }
      );
    }
    startScanner();

    return () => {
      controls?.stop();
    };
  }, []);

  const handleRedeem = useCallback(() => {
    // No-op if no codes
    if (data.length === 0) {
      return;
    }

    window.open(REDEEM_BASE + data.join(","), "_blank");

    // capture the last batch
    setBatches((draft) => {
      draft.push(data);
    });
    setData(() => []);
  }, [data]);

  return (
    <>
      <section>
        <button onClick={handleRedeem}>REDEEM</button>
      </section>
      <section>
        Scanned {data.length} codes. Latest: {data[data.length - 1] ?? "(none)"}
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
      </details>
    </>
  );
}
