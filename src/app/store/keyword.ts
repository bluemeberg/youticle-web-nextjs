import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist();

export const keywordState = atom({
  key: "keywordState",
  default: {
    daily: "",
    weekly: "",
  },
  effects_UNSTABLE: [persistAtom],
});
