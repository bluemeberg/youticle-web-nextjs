import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist();

export const userState = atom({
  key: "userState",
  default: {
    name: "",
    email: "",
    picture: "",
    id: 0,
  },
  effects_UNSTABLE: [persistAtom],
});
