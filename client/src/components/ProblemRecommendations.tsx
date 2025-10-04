import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ExternalLink, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Problem {
  contestId: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
}

interface ProblemRecommendationsProps {
  weakTags: string[];
  solvedProblems: Set<string>;
  userRating?: number;
}

export default function ProblemRecommendations({
  weakTags,
  solvedProblems,
  userRating = 1200,
}: ProblemRecommendationsProps) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [ratingRange, setRatingRange] = useState<string>("nearby");

  useEffect(() => {
    fetchProblems();
  }, []);

  useEffect(() => {
    filterProblems();
  }, [problems, selectedTag, ratingRange, weakTags, solvedProblems]);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://codeforces.com/api/problemset.problems");
      const data = await response.json();
      if (data.status === "OK") {
        setProblems(data.result.problems);
      }
    } catch (err) {
      console.error("Failed to fetch problems:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterProblems = () => {
    let filtered = problems.filter((problem) => {
      const problemKey = `${problem.contestId}-${problem.index}`;
      if (solvedProblems.has(problemKey)) return false;
      if (!problem.rating) return false;

      const tagMatch =
        selectedTag === "all"
          ? weakTags.some((tag) => problem.tags.includes(tag))
          : problem.tags.includes(selectedTag);

      if (!tagMatch) return false;

      const targetRating = userRating || 1200;
      if (ratingRange === "nearby") {
        return Math.abs(problem.rating - targetRating) <= 200;
      } else if (ratingRange === "easier") {
        return problem.rating >= targetRating - 400 && problem.rating < targetRating;
      } else if (ratingRange === "harder") {
        return problem.rating > targetRating && problem.rating <= targetRating + 400;
      }

      return true;
    });

    filtered.sort(() => Math.random() - 0.5);
    setFilteredProblems(filtered.slice(0, 10));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Recommended Problems (Based on Weak Tags)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-48" data-testid="select-tag">
              <SelectValue placeholder="Select tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Weak Tags</SelectItem>
              {weakTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={ratingRange} onValueChange={setRatingRange}>
            <SelectTrigger className="w-40" data-testid="select-difficulty">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easier">Easier</SelectItem>
              <SelectItem value="nearby">Your Level</SelectItem>
              <SelectItem value="harder">Challenging</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={filterProblems}
            data-testid="button-refresh-recommendations"
            title="Refresh recommendations"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading problems...</p>
        ) : filteredProblems.length > 0 ? (
          <div className="space-y-2">
            {filteredProblems.map((problem, index) => (
              <a
                key={`${problem.contestId}-${problem.index}`}
                href={`https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-md bg-accent hover-elevate active-elevate-2 transition-colors group"
                data-testid={`link-recommendation-${index}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{problem.name}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {problem.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant={weakTags.includes(tag) ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Badge className="ml-2 font-mono">{problem.rating}</Badge>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No recommendations available. Try adjusting filters or solve more problems to identify weak areas.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
