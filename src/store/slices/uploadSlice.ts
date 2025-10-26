import { UploadItem, UploadState } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: UploadState = {
  uploads: [],
};

const uploadSlice = createSlice({
  name: "uploads",
  initialState,
  reducers: {
    addUpload: (state, action: PayloadAction<UploadItem>) => {
      state.uploads.push(action.payload);
    },
    updateProgress: (
      state,
      action: PayloadAction<{ id: string; progress: number }>
    ) => {
      const upload = state.uploads.find((u) => u.id === action.payload.id);
      if (upload) upload.progress = action.payload.progress;
    },
    markCompleted: (state, action: PayloadAction<{ id: string }>) => {
      const upload = state.uploads.find((u) => u.id === action.payload.id);
      if (upload) {
        upload.status = "success";
        upload.finishedAt = Date.now();
      }
    },
    markError: (
      state,
      action: PayloadAction<{ id: string; error: string }>
    ) => {
      const upload = state.uploads.find((u) => u.id === action.payload.id);
      if (upload) {
        upload.status = "error";
        upload.error = action.payload.error;
        upload.finishedAt = Date.now();
      }
    },
    removeUpload: (state, action: PayloadAction<{ id: string }>) => {
      state.uploads = state.uploads.filter((u) => u.id !== action.payload.id);
    },
  },
});

export const { addUpload, updateProgress, markCompleted, markError, removeUpload } =
  uploadSlice.actions;
export default uploadSlice.reducer;
