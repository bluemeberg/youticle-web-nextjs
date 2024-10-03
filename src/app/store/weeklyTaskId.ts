import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist();

export const weeklyKeywordTaskState = atom({
  key: "weeklyKeywordTaskState",
  default: {
    taskId: "",
    userId: "",
    type: "",
  },
  effects_UNSTABLE: [persistAtom],
});
