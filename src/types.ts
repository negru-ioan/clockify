export type Project = {
  id: number;
  name: string;
  client: string;
  tags: string[];
};
export type Entry = {
  id: number;
  description: string;
  user: string;
  project: number;
  projectName: string;
  client: string;
  tag: string;
  date: string;
  hours: number;
  startTime?: string;
  endTime?: string;
};
export type Data = {
  userName?: string;
  clients: string[];
  projects: Project[];
  entries: Entry[];
};
export type View = "tracker" | "reports" | "settings" | "calendar";
export type ActivityValues = {
  id: number;
  description: string;
  user: string;
  client: string;
  project: string;
  tag: string;
  date: string;
  hours: string;
  startTime: string;
  endTime: string;
};
