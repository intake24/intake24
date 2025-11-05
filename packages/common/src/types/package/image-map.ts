export interface PkgImageMapObject {
  description: string;
  navigationIndex: number;
  outlineCoordinates: number[];
}

export interface PkgImageMap {
  description: string;
  baseImagePath: string;
  objects: Record<number, PkgImageMapObject>;
}
