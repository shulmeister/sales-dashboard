import { ShowBase, useShowContext } from "ra-core";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import type { Contact } from "../types";
import { Avatar } from "./Avatar";
import { ContactAside } from "./ContactAside";
import { TagsList } from "./TagsList";

export const ContactShow = () => (
  <ShowBase>
    <ContactShowContent />
  </ShowBase>
);

const ContactShowContent = () => {
  const { record, isPending } = useShowContext<Contact>();
  if (isPending || !record) return null;

  const displayName =
    record.name ||
    `${record.first_name || ""} ${record.last_name || ""}`.trim() ||
    "Unnamed contact";

  return (
    <div className="mt-2 mb-2 flex gap-8">
      <div className="flex-1">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar />
              <div className="flex-1">
                <h5 className="text-xl font-semibold">{displayName}</h5>
                <div className="text-sm text-muted-foreground">
                  {[record.company, record.title].filter(Boolean).join(" • ")}
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {record.contact_type && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      {record.contact_type}
                    </Badge>
                  )}
                  {record.status && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {record.status}
                    </Badge>
                  )}
                  <TagsList />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <Detail label="Email" value={record.email} />
              <Detail label="Phone" value={record.phone} />
              <Detail label="Address" value={record.address} />
              <Detail label="Source" value={record.source} />
            </div>

            {record.notes && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Notes</div>
                <div className="whitespace-pre-wrap">{record.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <ContactAside />
    </div>
  );
};

const Detail = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  ) : null;
