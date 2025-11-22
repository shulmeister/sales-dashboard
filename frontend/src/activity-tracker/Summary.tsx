import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import { ActivityNav } from "./ActivityNav";
import { UploadPanel } from "./UploadPanel";

type SummaryStats = {
  totalVisits: string;
  totalCosts: string;
  bonusesEarned: string;
  costPerVisit: string;
  emailsSent: string;
  totalHours: string;
};

const initialStats: SummaryStats = {
  totalVisits: "-",
  totalCosts: "-",
  bonusesEarned: "-",
  costPerVisit: "-",
  emailsSent: "-",
  totalHours: "-",
};

const formatCurrency = (value?: number) =>
  value != null ? `$${Math.round(value).toLocaleString()}` : "-";

const Summary = () => {
  const [stats, setStats] = useState<SummaryStats>(initialStats);

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const summaryRes = await fetch("/api/dashboard/summary", {
          credentials: "include",
        });
        if (!summaryRes.ok) {
          throw new Error("Failed to fetch summary");
        }
        const summary = await summaryRes.json();
        setStats({
          totalVisits: Number(summary.total_visits || 0).toLocaleString(),
          totalCosts: formatCurrency(summary.total_costs),
          bonusesEarned: formatCurrency(summary.total_bonuses),
          costPerVisit: formatCurrency(summary.cost_per_visit),
          emailsSent:
            summary.emails_sent_7_days != null
              ? Number(summary.emails_sent_7_days).toLocaleString()
              : "-",
          totalHours: Math.round(summary.total_hours || 0).toLocaleString(),
        });
      } catch (error) {
        console.error("Error fetching summary data:", error);
        setStats(initialStats);
      }
    };

    fetchSummaryData();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <ActivityNav />
      <Typography
        variant="h5"
        component="h1"
        gutterBottom
        sx={{ mb: 3, color: "#f1f5f9", fontWeight: 600 }}
      >
        Sales Dashboard Summary
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard title="Total Visits" value={stats.totalVisits} icon="📊" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            title="Total Costs"
            subtitle="Excluding Bonuses"
            value={stats.totalCosts}
            icon="💰"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            title="Bonuses Earned"
            value={stats.bonusesEarned}
            icon="🏆"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            title="Cost Per Visit"
            value={stats.costPerVisit}
            icon="📈"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            title="Emails Sent"
            subtitle="Last 7 Days"
            value={stats.emailsSent}
            icon="📧"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard title="Total Hours" value={stats.totalHours} icon="⏰" />
        </Grid>
      </Grid>

      <Box
        sx={{
          backgroundColor: "#1e293b",
          p: 3,
          borderRadius: 2,
          border: "1px solid #334155",
          mt: 3,
        }}
      >
        <Typography
          variant="h6"
          sx={{ color: "#f1f5f9", mb: 2, fontWeight: 600 }}
        >
          Quick Stats
        </Typography>
        <Typography sx={{ color: "#94a3b8", lineHeight: 1.6, fontSize: "0.9rem" }}>
          This summary shows your key performance metrics across all sales
          activities. Visit the other tabs to view detailed visits, manage
          uploads, or check activity logs.
        </Typography>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ color: "#f1f5f9", fontWeight: 600 }}>
          Upload Visits or Business Cards
        </Typography>
        <Typography sx={{ color: "#94a3b8", fontSize: "0.9rem", mb: 2 }}>
          Upload MyWay route PDFs, time tracking PDFs, or business card photos. We
          will parse the details automatically and add them to your tracker.
        </Typography>
        <UploadPanel showLegacyLink={false} />
      </Box>
    </Container>
  );
};

const KPICard = ({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: string;
  subtitle?: string;
}) => (
  <Card
    sx={{
      backgroundColor: "#1e293b",
      border: "1px solid #334155",
      height: "100%",
    }}
  >
    <CardContent sx={{ p: 2 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={1}
      >
        <Box flex={1}>
          <Typography
            variant="body2"
            sx={{ color: "#94a3b8", fontSize: "0.75rem", mb: 0.5 }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ color: "#64748b", fontSize: "0.65rem" }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: "rgba(59, 130, 246, 0.12)",
            borderRadius: 1.5,
            p: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
          }}
        >
          {icon}
        </Box>
      </Box>
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, color: "#f1f5f9", fontSize: "2rem", mt: 1 }}
      >
        {value}
      </Typography>
    </CardContent>
  </Card>
);

export default Summary;
export { Summary };

