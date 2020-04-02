import { MODIFIED_SUBTITLE_TYPE } from '@/constants';
import { LanguageCode } from '../libs/language';

type Partial<T> = { [P in keyof T]?: T[P] };

export enum Type {
  Online = 'online',
  Embedded = 'embedded',
  Local = 'local',
  Translated = 'translated',
  PreTranslated = 'preTranslated',
  Modified = 'modified',
}
export enum Format {
  AdvancedSubStationAplha = 'ass',
  DvbSub = 'dvb_subtitle',
  HdmvPgs = 'hdmv_pgs_subtitle',
  SagiImage = 'sagi_image_subtitle',
  SagiText = 'sagi',
  SubRip = 'subrip',
  SubStationAlpha = 'ssa',
  VobSub = 'dvd_subtitle',
  WebVTT = 'webvtt',
  Unknown = 'unknown',
}

/** subtitle source used to retrieve subtitle or display info */
export interface IOrigin {
  type: Type;
  source: unknown;
}
/** necessary subtitle information */
export interface IEntity {
  /** subtitle source used to display info, like in SubtitleControl */
  displaySource: IOrigin;
  /** subtitle source used to retrieve real subtitle */
  realSource: IOrigin;
  /** subtitle unique id (determined upon first created) */
  hash: string;
  format: Format;
  language: LanguageCode;
  delay: number;
}
/** provide necessary subtitle info from variant sources */
export interface IEntityGenerator {
  getDisplaySource(): Promise<IOrigin>;
  getRealSource(): Promise<IOrigin>;
  getHash(): Promise<string>
  getFormat(): Promise<Format>
  getLanguage(): Promise<LanguageCode>
  getDelay(): Promise<number>
  /** get raw video segments (which can be restored as IVideoSegments) */
  getVideoSegments?: () => Promise<IRawVideoSegment[]>
  /** whether this subtitle has been auto uploaded */
  getAutoUploaded?: () => Promise<boolean>
}
/** necessary subtitle info used to display in SubtitleControl */
export interface ISubtitleControlListItem {
  /** subtitle uuid (generated at every initialization, not like hash) */
  id: string;
  /** subtitle unique id (determined upon first created) */
  hash: string;
  type: Type;
  language: LanguageCode;
  source: IOrigin;
  /** subtitle final name (can be changed at certain circumstances) */
  name?: string;
}
/** get real payload from subtitle real source (with streaming support) */
export interface ILoader {
  readonly source: IOrigin;
  /** whether this subtitle can be preloaded (online subtitle, local subtitle e.g.) */
  readonly canPreload: boolean;
  /** whether this subtitle can be cached */
  readonly canCache: boolean;
  /** whether this subtitle can be uploaded */
  readonly canUpload: boolean;
  /** whether this subtitle has been fully read */
  readonly fullyRead: boolean;
  /** get subtitle metadata string */
  getMetadata(): Promise<string>;
  /** get subtitle payload (param time may be unsupported) */
  getPayload(time?: number): Promise<unknown>;
  /** pause the subtitle loading process (may be unsupported) */
  pause(): void | Promise<void>;
  /** cache the loaded subtitle (only if it can be cached) */
  cache(): Promise<IOrigin>;
  /** notify outside the loading process (mainly for reactivity use) */
  on(event: 'cache' | 'read' | 'upload', callback: (result: boolean) => void): void;
  /** notify outside the loading process once (mainly for reactivity use) */
  once(event: 'cache' | 'read' | 'upload', callback: (result: boolean) => void): void;
  /** release the resources used */
  destroy(): Promise<void>
}
/** subtitle loader controller and parser */
export interface IParser {
  readonly format: Format;
  readonly loader: ILoader;
  /** to update/get subtitle played time */
  readonly videoSegments: IVideoSegments;
  getMetadata(): Promise<IMetadata>;
  getDialogues(time?: number): Promise<Cue[]>;
}
/** pieces of start and end time */
export interface ITimeSegments {
  /** insert start time and end time */
  insert(start: number, end: number): void;
  /** check if given time is in range */
  check(time: number): boolean;
}
export interface IVideoSegments extends ITimeSegments {
  /** update video segments' played status by two timestamps */
  updatePlayed(timeStamp: number, lastTimeStamp?: number): void;
  /** subtitle's played time (generated by video segments' played status) */
  readonly playedTime: number;
  /** export raw video segments */
  export(): IRawVideoSegment[];
  /** restore from raw video segments */
  restore(videoSegments: IRawVideoSegment[]): void;
}
/** like video segments, but in a readable manner */
export interface IRawVideoSegment {
  start: number;
  end: number;
  played: boolean;
}

export interface IMetadata {
  PlayResX?: string;
  PlayResY?: string;
}

export interface ITags {
  b?: number;
  i?: number;
  u?: number;
  s?: number;
  alignment?: number;
  pos?: {
    x: number;
    y: number;
  };
  // https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API#Cue_settings
  vertical?: string;
  line?: string;
  position?: string;
  // size: string;
  // align: string';
}
export type TagsPartial = Partial<ITags>;

export type TextCue = {
  category?: string,
  start: number,
  end: number,
  text: string,
  format: string,
  tags: ITags,
  overRange?: boolean,
  track?: number,
  index?: number,
  selfIndex?: number,
}

export type ImageCue = {
  start: number,
  end: number,
  payload: Buffer,
  format: Format,
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
};

export type Cue = TextCue | ImageCue;
export type EditCue = {
  text: string,
  track: number,
  index: number,
  originStart: number,
  originEnd: number,
  minLeft: number,
  maxLeft: number,
  minRight: number,
  maxRight: number,
  left: number,
  right: number,
  width: number,
  originLeft: number,
  originRight: number,
  originWidth: number,
  focus: boolean,
  opacity: number,
  reference?: boolean,
  selfIndex?: number,
  distance?: number,
}

export type ModifiedCues = {
  dialogues: TextCue[],
  meta: IMetadata,
  info: {
    hash: string,
    reference?: ISubtitleControlListItem,
    path: string,
    format?: Format,
    language?: LanguageCode,
    text?: string,
  }
}

export type ModifiedSubtitle = {
  cue: TextCue,
  type: MODIFIED_SUBTITLE_TYPE,
  index: number,
  selfIndex?: number,
  delCue?: TextCue,
};

export const NOT_SELECTED_SUBTITLE = 'NOT_SELECTED_SUBTITLE';
