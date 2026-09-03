import { GAME_TYPES, type GameType } from "./index";

/** Backend catalog game_type union — keep in sync with game_catalog.py. */
type BackendGameType =
  | "memory_match"
  | "attention_reaction"
  | "sequencing"
  | "picture_naming"
  | "simple_arithmetic"
  | "path_maze"
  | "face_recall";

type AssertUnionMatchesBackend =
  GameType extends BackendGameType
    ? BackendGameType extends GameType
      ? true
      : never
    : never;

const _unionMatchesBackend: AssertUnionMatchesBackend = true;

type AssertTupleMatchesUnion =
  GameType extends (typeof GAME_TYPES)[number]
    ? (typeof GAME_TYPES)[number] extends GameType
      ? true
      : never
    : never;

const _tupleMatchesUnion: AssertTupleMatchesUnion = true;

// @ts-expect-error arbitrary strings are not canonical GameType values
const _rejectInvalid: GameType = "simon_says";

export const GAME_TYPES_ASSERTIONS = {
  unionMatchesBackend: _unionMatchesBackend,
  tupleMatchesUnion: _tupleMatchesUnion,
};
