"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { Button } from "@/components/ui/button";

export default function UrlTable({ urls = [], handleDeleteKBSource }: any) {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {/* <TableHead className="w-[50px]"><Checkbox /></TableHead> */}
            <TableHead>Path</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[120px] text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {urls?.length > 0 ? (
            urls.map((item: any) => (
              <TableRow key={item?.id}>
                {/* <TableCell><Checkbox /></TableCell> */}
                <TableCell>
                  <a
                    href={item?.data?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:cursor-pointer"
                  >
                    {item?.data?.url}
                  </a>
                </TableCell>
                <TableCell>{item?.created_at?.split("T")?.[0]}</TableCell>
                <TableCell className="text-center">
                  <DeleteConfirmDialog
                    title="Remove Web Source from Knowledge Base"
                    description={`This web URL will be permanently removed from the knowledge base. This action cannot be undone.`}
                    onConfirm={() => handleDeleteKBSource(item.id, item.kb_id)}
                    trigger={
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center py-6 text-sm text-gray-500"
              >
                No URLs found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
