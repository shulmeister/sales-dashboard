import { useRecordContext } from "ra-core";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import type { Contact } from "../types";
import { TagsList } from "./TagsList";

export const ContactAside = () => {
  const record = useRecordContext<Contact>();
  if (!record) return null;

  return (
    <div className="hidden sm:block w-64 min-w-64 text-sm">
      <Card>
        <CardContent className="flex flex-col gap-3 pt-4">
          {record.status && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="secondary" className="text-xs font-normal">
                {record.status}
              </Badge>
            </div>
          )}
          {record.contact_type && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Type</span>
              <Badge variant="secondary" className="text-xs font-normal">
                {record.contact_type}
              </Badge>
            </div>
          )}
          {record.tags && (
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Tags</span>
              <TagsList />
            </div>
          )}
          {record.source && (
            <div>
              <div className="text-muted-foreground">Source</div>
              <div>{record.source}</div>
            </div>
          )}
          {record.last_activity && (
            <div>
              <div className="text-muted-foreground">Last activity</div>
              <div>
                {new Date(record.last_activity).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
            </div>
          )}
          {record.account_manager && (
            <div>
              <div className="text-muted-foreground">Account manager</div>
              <div>{record.account_manager}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
