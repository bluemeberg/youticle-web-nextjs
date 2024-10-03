import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist();

export const dailyKeywordTaskState = atom({
  key: "dailyKeywordTaskState",
  default: {
    taskId: "",
    userId: "",
    type: "",
  },
  effects_UNSTABLE: [persistAtom],
});
