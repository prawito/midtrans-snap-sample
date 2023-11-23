import { useEffect, useState } from "react";
import { MIDTRANS_CLIENT_ID } from "../utils/const";

const useSnap = () => {
  const [snap, setSnap] = useState(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://app.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", MIDTRANS_CLIENT_ID);
    script.onload = () => setSnap(window.snap);
    document.body.appendChild(script);

    return () => document.body.removeChild(script);
  }, []);

  const snapEmbed = (snap_token, embedId) =>
    snap && snap.embed(snap_token, { embedId });

  const snapPopup = (snap_token) => snap && snap.pay(snap_token);

  const snapRedirect = (snap_redirect_url) =>
    snap && (window.location.href = snap_redirect_url);

  return { snapEmbed, snapPopup, snapRedirect };
};

export default useSnap;
