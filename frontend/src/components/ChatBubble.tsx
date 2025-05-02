import { Box, Paper, Typography, Avatar } from "@suid/material";

interface ChatBubbleProps {
  text: string;
  sender: "user" | "ai";
}

export default function ChatBubble({ text, sender }: ChatBubbleProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: sender === "user" ? "flex-end" : "flex-start",
        mb: 1,
      }}
    >
      {/* {sender === "ai" && (
        <p>Commander Champion</p>
      )} */}
      
      <Paper
        elevation={1}
        sx={{
          p: 1.5,
          bgcolor: sender === "user" ? "rgb(3, 150, 156)": "rgb(189, 104, 105)",
          color: sender === "user" ? "#fff" : "rgb(244, 231, 232)",
          borderRadius: sender === "user"
            ? "18px 18px 4px 18px"
            : "18px 18px 18px 4px",
          maxWidth: "70%",
        }}
      >
              {/* {sender === "user" && (
        <Typography sx={{fontFamily: '"Share Tech Mono", "Iceland", "Audiowide", "Roboto Mono", monospace'}}>
        Challenger
        </Typography>
      )} */}
        <Typography variant="body1">{text}</Typography>
      </Paper>

    </Box>
  );
}