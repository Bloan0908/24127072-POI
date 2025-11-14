
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PointOfInterest {
  name: string;
  description: string;
  coordinates: Coordinates;
}
