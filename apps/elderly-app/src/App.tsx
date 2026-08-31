import { Navigate, Route, Routes } from "react-router-dom";

import { AppFrame } from "./layout/AppFrame";
import { ArithmeticGame } from "./games/Arithmetic/ArithmeticGame";
import { AttentionGame } from "./games/AttentionReaction/AttentionGame";
import { FaceRecallGame } from "./games/FaceRecall/FaceRecallGame";
import { MemoryMatch } from "./games/MemoryMatch/MemoryMatch";
import { NamingGame } from "./games/PictureNaming/NamingGame";
import { PathMazeGame } from "./games/PathMaze/PathMazeGame";
import { SequencingGame } from "./games/Sequencing/SequencingGame";
import { GameResult } from "./screens/GameResult";
import { GameSelect } from "./screens/GameSelect";
import { Login } from "./screens/Login";
import { MemoryCultural, MemoryPersonal, Reminiscence } from "./screens/Reminiscence";
import { Reminders } from "./screens/Reminders";
import { RootGate } from "./screens/RootGate";
import { Settings } from "./screens/Settings";
import { Splash } from "./screens/Splash";

export function App() {
  return (
    <AppFrame>
      <Routes>
        <Route path="/splash" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RootGate />} />
        <Route path="/games" element={<GameSelect />} />
        <Route path="/games/memory-match" element={<MemoryMatch />} />
        <Route path="/games/attention-reaction" element={<AttentionGame />} />
        <Route path="/games/sequencing" element={<SequencingGame />} />
        <Route path="/games/picture-naming" element={<NamingGame />} />
        <Route path="/games/arithmetic" element={<ArithmeticGame />} />
        <Route path="/games/path-maze" element={<PathMazeGame />} />
        <Route path="/games/face-recall" element={<FaceRecallGame />} />
        <Route path="/games/memory-match/result" element={<GameResult />} />
        <Route path="/games/attention-reaction/result" element={<GameResult />} />
        <Route path="/games/sequencing/result" element={<GameResult />} />
        <Route path="/games/picture-naming/result" element={<GameResult />} />
        <Route path="/games/arithmetic/result" element={<GameResult />} />
        <Route path="/games/path-maze/result" element={<GameResult />} />
        <Route path="/games/face-recall/result" element={<GameResult />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/memories" element={<Reminiscence />} />
        <Route path="/memories/personal" element={<MemoryPersonal />} />
        <Route path="/memories/cultural" element={<MemoryCultural />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/splash" replace />} />
      </Routes>
    </AppFrame>
  );
}
