import "./styles.css";
import React from "react";
import { useImmer } from "use-immer";
import { QrReader } from "@blackbox-vision/react-qr-reader";

export default function App() {
  const [data, setData] = useImmer<string[]>([]);
  return (
    <div className="m-5">
      <h1 className="text-3xl">REDEEMER</h1>
      <QrReader
        videoStyle={{ display: "none" }}
        constraints={{ facingMode: "user" }}
        onResult={(result, error) => {
          if (!!result) {
            const text = result.getText();
            setData((draft) => {
              if (!draft.includes(text)) {
                draft.push(text);
              }
            });
          }

          if (!!error) {
            console.info(error);
          }
        }}
      />
      <h2>Results</h2>
      <ul>
        {data.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
