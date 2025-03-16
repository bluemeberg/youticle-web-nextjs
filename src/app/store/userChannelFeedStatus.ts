// store/channelFeed.ts
import { atom } from "recoil";

export const channelFeedRefreshTrigger = atom<number>({
  key: "channelFeedRefreshTrigger",
  default: 0,
});
