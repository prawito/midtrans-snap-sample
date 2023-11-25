/* eslint-disable react/prop-types */
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import useSnap from "../../hooks/useSnap";

export const Pay = ({ transaction, onPayChange }) => {
  const navigate = useNavigate();
  const { snapEmbed } = useSnap();

  const pay = async () => {
    onPayChange(true);
    snapEmbed(transaction.snap_token, "snap-container", {
      onSuccess: function () {
        navigate(`/order-status?transaction_id=${transaction.id}`);
        onPayChange(false);
      },
      onPending: function () {
        navigate(`/order-status?transaction_id=${transaction.id}`);
        onPayChange(false);
      },
      onClose: function () {
        navigate(`/order-status?transaction_id=${transaction.id}`);
        onPayChange(false);
      },
    });
  };

  return <Button onClick={pay}>Bayar Sekarang</Button>;
};
