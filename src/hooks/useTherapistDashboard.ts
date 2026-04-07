import { useQuery } from "@tanstack/react-query";
import { getTherapistLearners, type LearnerWithStats } from "@/lib/therapistData";

export const useTherapistDashboard = (therapistId: string | undefined) => {
  return useQuery<LearnerWithStats[]>({
    queryKey: ["therapist-learners", therapistId],
    queryFn: () => getTherapistLearners(therapistId!),
    enabled: !!therapistId,
    staleTime: 30_000,
  });
};
