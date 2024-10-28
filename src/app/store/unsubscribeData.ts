// store/atoms.ts
import { atom } from "recoil";
import { DataProps } from "@/types/dataProps";

export const unsubscribedDataState = atom<DataProps[]>({
  key: "unsubscribedDataState", // 고유 키
  default: [], // 기본값
});
