import { Timestamp } from "firebase/firestore";

export const formatDate = (date: Timestamp | Date) => {
  const jsDate = date instanceof Timestamp ? date.toDate() : new Date(date);

  return jsDate.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
