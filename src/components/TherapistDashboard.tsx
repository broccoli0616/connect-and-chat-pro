import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useTherapistDashboard } from "@/hooks/useTherapistDashboard";
import { addLearnerByEmail } from "@/lib/therapistData";
import { Activity, ArrowLeft, ClipboardList, TrendingUp, Users, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TherapistDashboardProps {
  onBack: () => void;
}

const TherapistDashboard = ({ onBack }: TherapistDashboardProps) => {
  const { profile, user } = useAuth();
  const { data: learners = [], isLoading, refetch } = useTherapistDashboard(user?.id);
  const [addLearnerName, setAddLearnerName] = useState("");
  const [addError, setAddError] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const totalLearners = learners.length;
  const totalSessions = learners.reduce((sum, l) => sum + l.completedSessions, 0);
  const averageAcceptance = totalLearners > 0
    ? Math.round(learners.reduce((sum, l) => sum + l.acceptanceRate, 0) / totalLearners)
    : 0;

  const handleAddLearner = async () => {
    if (!user || !addLearnerName.trim()) return;
    setIsAdding(true);
    setAddError("");

    const { error } = await addLearnerByEmail(user.id, addLearnerName.trim());
    setIsAdding(false);

    if (error) {
      setAddError(error);
      return;
    }

    setAddLearnerName("");
    refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <p className="text-sm font-medium text-primary mb-2">Therapist Portal</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Learner Progress Overview
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Track engagement and session progress for your learners.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-foreground">{profile?.name}</p>
              <p className="text-sm text-muted-foreground">Therapist account</p>
            </div>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" /> Log out
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
          <Card className="border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground">Active roster</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{totalLearners}</p>
              <p className="text-sm text-muted-foreground mt-1">Learners assigned</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <ClipboardList className="w-5 h-5 text-accent" />
                <span className="text-xs font-semibold text-muted-foreground">Total</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{totalSessions}</p>
              <p className="text-sm text-muted-foreground mt-1">Completed sessions</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground">Average</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{averageAcceptance}%</p>
              <p className="text-sm text-muted-foreground mt-1">Acceptance rate</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-5 h-5 text-accent" />
                <span className="text-xs font-semibold text-muted-foreground">Roster</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{totalLearners}</p>
              <p className="text-sm text-muted-foreground mt-1">Linked learners</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-2xl">Learner Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading && (
                <p className="text-sm text-muted-foreground">Loading learner data...</p>
              )}

              {!isLoading && learners.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-foreground font-semibold mb-1">No learners yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add a learner by name using the panel on the right.
                  </p>
                </div>
              )}

              {learners.map((entry) => {
                const goalProgress = entry.weeklyGoal > 0
                  ? Math.min(100, Math.round((entry.completedSessions / entry.weeklyGoal) * 100))
                  : 0;

                return (
                  <div key={entry.learner.id} className="rounded-2xl border border-border p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2 max-w-xl">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{entry.learner.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {entry.supportNeed ? `Focus: ${entry.supportNeed}` : "No support need set"}
                          </p>
                        </div>
                        {entry.notes && <p className="text-sm text-muted-foreground">{entry.notes}</p>}
                        <p className="text-xs font-medium text-muted-foreground">
                          Last active: {entry.lastActive
                            ? formatDistanceToNow(new Date(entry.lastActive), { addSuffix: true })
                            : "Never"}
                        </p>
                      </div>

                      <div className="w-full lg:max-w-xs space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Weekly target</span>
                            <span className="font-semibold text-foreground">
                              {entry.completedSessions}/{entry.weeklyGoal}
                            </span>
                          </div>
                          <Progress value={goalProgress} className="h-2" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Acceptance rate</span>
                            <span className="font-semibold text-foreground">
                              {entry.acceptanceRate}%
                            </span>
                          </div>
                          <Progress value={entry.acceptanceRate} className="h-2" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Total sessions</span>
                            <span className="font-semibold text-foreground">
                              {entry.totalSessions}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-2xl flex items-center gap-2">
                  <UserPlus className="w-5 h-5" /> Add Learner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Enter a learner's name to link them to your account.
                </p>
                <Input
                  type="text"
                  value={addLearnerName}
                  onChange={(e) => setAddLearnerName(e.target.value)}
                  placeholder="Learner name"
                  className="h-10"
                />
                {addError && <p className="text-sm text-destructive">{addError}</p>}
                <Button
                  className="w-full"
                  disabled={!addLearnerName.trim() || isAdding}
                  onClick={handleAddLearner}
                >
                  {isAdding ? "Adding..." : "Link Learner"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-2xl">Getting Started</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Learner stats will appear once they complete practice sessions.
                  Add learners by name, then track their progress here.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapistDashboard;
