import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import EventIcon from "@mui/icons-material/Event";

import { ActivityNav } from "./ActivityNav";

type Activity = {
  type: string;
  description: string;
  date: string;
  details?: Record<string, unknown>;
};

const typeLabels: Record<string, string> = {
  visit: "Visit",
  time_entry: "Time Entry",
  contact: "Contact",
};

const typeColors: Record<string, string> = {
  visit: "#34d399",
  time_entry: "#60a5fa",
  contact: "#f472b6",
};

export const ActivityLogs = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/recent-activity?limit=50", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to load activity logs");
      }
      const data = (await response.json()) as Activity[];
      setActivities(data);
    } catch (error) {
      console.error("Error loading activity", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const grouped = useMemo(() => {
    return activities.reduce<Record<string, Activity[]>>((acc, activity) => {
      const dateKey = new Date(activity.date).toLocaleDateString();
      acc[dateKey] = acc[dateKey] || [];
      acc[dateKey].push(activity);
      return acc;
    }, {});
  }, [activities]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <ActivityNav />
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#f1f5f9" }}>
          Recent Activity
        </Typography>
        <IconButton onClick={fetchActivities} disabled={loading} aria-label="Refresh logs">
          <RefreshIcon sx={{ color: "#94a3b8" }} />
        </IconButton>
      </Box>

      <Card sx={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
        <CardContent>
          {loading ? (
            <Typography sx={{ color: "#94a3b8" }}>Loading activity…</Typography>
          ) : activities.length === 0 ? (
            <Typography sx={{ color: "#94a3b8" }}>
              No recent activity recorded. Upload visits or log hours to populate this feed.
            </Typography>
          ) : (
            Object.entries(grouped).map(([date, entries]) => (
              <Box key={date} sx={{ mb: 4 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <EventIcon sx={{ color: "#38bdf8" }} />
                  <Typography sx={{ color: "#e2e8f0", fontWeight: 600 }}>{date}</Typography>
                </Box>
                <List>
                  {entries.map((activity, index) => (
                    <ListItem
                      key={`${activity.date}-${activity.description}-${index}`}
                      sx={{
                        backgroundColor: "rgba(15, 23, 42, 0.6)",
                        borderRadius: "8px",
                        mb: 1,
                        border: "1px solid rgba(148, 163, 184, 0.12)",
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={typeLabels[activity.type] || activity.type}
                              size="small"
                              sx={{
                                backgroundColor:
                                  typeColors[activity.type] || "rgba(148,163,184,0.3)",
                                color: "#0f172a",
                              }}
                            />
                            <Typography sx={{ color: "#f8fafc", fontWeight: 600 }}>
                              {activity.description}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography sx={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                            {new Date(activity.date).toLocaleTimeString()} •
                            {" "}
                            {activity.details && JSON.stringify(activity.details)}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default ActivityLogs;
