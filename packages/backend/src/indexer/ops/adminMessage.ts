import { StoredEntry } from "../storage/dump";

export type AdminMessage =
  | {
      type: "RESET";
    }
  | {
      type: "GET_KEYS";
      cursor?: string;
    }
  | {
      type: "START";
    }
  | {
      type: "STOP";
    }
  | {
      type: "STEP";
    }
  | {
      type: "WRITE_BATCH";
      items: StoredEntry[][];
    }
  | {
      type: "CLEAR_STORAGE";
    };

export async function sendAdminMessage(message: AdminMessage) {
  while (true) {
    try {
      const response = await fetch(
        "https://nouns-agora-staging.act.workers.dev/admin/ops",
        {
          method: "POST",
          body: JSON.stringify(message),
          headers: {
            "x-admin-api-key": process.env.ADMIN_API_KEY!,
            "x-durable-object-instance-name":
              process.env.DURABLE_OBJECT_INSTANCE_NAME!,
          },
        }
      );
      if (response.status !== 200) {
        throw new Error(
          `non-200 response ${response.status} ${
            response.statusText
          } ${await response.text()}`
        );
      }
      return await response.text();
    } catch (e) {
      console.error(e);
    }
  }
}
