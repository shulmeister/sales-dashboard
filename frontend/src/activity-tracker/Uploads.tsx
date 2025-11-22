import { Box, Container, Typography } from "@mui/material";

import { ActivityNav } from "./ActivityNav";
import { UploadPanel } from "./UploadPanel";

export const Uploads = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <ActivityNav />
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#f1f5f9" }}>
            Upload Visits or Business Cards
          </Typography>
          <Typography sx={{ color: "#94a3b8", fontSize: "0.9rem" }}>
            Upload MyWay route PDFs, time tracking PDFs, or business card photos. We
            will parse the details automatically and add them to your tracker.
          </Typography>
        </Box>
      </Box>

      <UploadPanel />
    </Container>
  );
};

export default Uploads;
