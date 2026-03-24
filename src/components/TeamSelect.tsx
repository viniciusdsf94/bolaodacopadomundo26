import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { worldCupTeams } from "@/lib/worldCupTeams";
import { Label } from "@/components/ui/label";

interface TeamSelectProps {
  value: string;
  onChange: (teamName: string, flagUrl: string) => void;
  label: string;
  excludeTeam?: string;
}

const TeamSelect = ({ value, onChange, label, excludeTeam }: TeamSelectProps) => {
  const teams = excludeTeam
    ? worldCupTeams.filter((t) => t.name !== excludeTeam)
    : worldCupTeams;

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select
        value={value}
        onValueChange={(name) => {
          const team = worldCupTeams.find((t) => t.name === name);
          if (team) onChange(team.name, team.flag);
        }}
      >
        <SelectTrigger className="bg-secondary border-border">
          <SelectValue placeholder="Selecione o país">
            {value && (
              <span className="flex items-center gap-2">
                <img
                  src={worldCupTeams.find((t) => t.name === value)?.flag}
                  alt={value}
                  className="h-4 w-6 rounded object-cover"
                />
                {value}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {teams.map((team) => (
            <SelectItem key={team.code} value={team.name}>
              <span className="flex items-center gap-2">
                <img src={team.flag} alt={team.name} className="h-4 w-6 rounded object-cover" />
                {team.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TeamSelect;
