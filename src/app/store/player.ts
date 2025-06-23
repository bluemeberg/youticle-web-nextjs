import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist();

export const playerState = atom({
  key: "playerState",
  default: true,
  effects_UNSTABLE: [persistAtom],
});
