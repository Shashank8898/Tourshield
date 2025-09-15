import { useEffect, useState } from "react";

function BlockQR({ index }) {
  const [qr, setQr] = useState("");

  useEffect(() => {
    async function fetchQR() {
      try {
        const res = await fetch(`http://localhost:5000/block/${index}/qr`);
        const data = await res.json();
        setQr(data.qr);
      } catch (err) {
        console.error("Failed to fetch QR", err);
      }
    }
    fetchQR();
  }, [index]);

  return (
    <div>
      <h2>Block {index} QR Code</h2>
      {qr ? <img src={qr} alt={`Block ${index} QR`} /> : <p>Loading...</p>}
    </div>
  );
}

export default BlockQR;
