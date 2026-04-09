import Pusher from "pusher";
import { ENV } from "../../share/common/value"

const requiredEnvs = ["PUSHER_APP_ID", "PUSHER_KEY", "PUSHER_SECRET", "PUSHER_CLUSTER"] as const;

export const isPusherConfigured = requiredEnvs.every((key) => Boolean(ENV[key]));

export const pusher = isPusherConfigured
  ? new Pusher({
      appId: ENV.PUSHER_APP_ID!,
      key: ENV.PUSHER_KEY!,
      secret: ENV.PUSHER_SECRET!,
      cluster: ENV.PUSHER_CLUSTER!,
      useTLS: true,
    })
  : null;

export const getPusherSocketUrl = (): string | null => {
  if (!ENV.PUSHER_KEY || !ENV.PUSHER_CLUSTER) {
    return null;
  }

  return `wss://ws-${ENV.PUSHER_CLUSTER}.pusher.com/app/${ENV.PUSHER_KEY}`;
};
