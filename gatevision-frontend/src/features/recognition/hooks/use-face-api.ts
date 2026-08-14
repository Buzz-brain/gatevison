import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { POLL_INTERVALS, QUERY_KEYS } from "@/lib/api/query-client";
import { useUIStore } from "@/store/ui-store";
import {
  enrollFaceApi,
  getFaceModelInfoApi,
  type EnrollFaceParams,
  type EnrollFaceResult,
} from "@/services/api/face.api";

export function useFaceModelInfo() {
  return useQuery({
    queryKey: QUERY_KEYS.FACE.MODEL_INFO,
    queryFn: getFaceModelInfoApi,
    staleTime: POLL_INTERVALS.BACKGROUND,
  });
}

export function useEnrollFace() {
  const qc = useQueryClient();
  const addNotification = useUIStore((s) => s.addNotification);

  return useMutation({
    mutationFn: (params: EnrollFaceParams) => enrollFaceApi(params),
    onSuccess: (data: EnrollFaceResult) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.IDENTITY.DRIVERS() });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.IDENTITY.STATS });
      addNotification({
        type: "success",
        category: "recognition",
        title: "Face enrolled",
        description: `${data.full_name} (${data.driver_id}) registered with a ${data.face_embedding_dimension}-dimension embedding.`,
      });
    },
    onError: (error: unknown) => {
      const message = (error as { message?: string })?.message || "Face enrollment failed";
      addNotification({
        type: "error",
        category: "recognition",
        title: "Face enrollment failed",
        description: message,
      });
    },
  });
}
