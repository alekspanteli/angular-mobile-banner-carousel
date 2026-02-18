export interface Banner {
  id: number;
  backgroundImage: string;
  mainImage: string;
  title: string;
  text: string;
  buttonText: string;
}

export interface TextSegment {
  text: string;
  highlight: boolean;
}
