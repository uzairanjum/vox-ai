"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileIcon, Trash2 } from "lucide-react";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

interface FileTableProps {
  files: any[];
  handleDeleteKBSource: (srcId: string, kbId: string) => Promise<void> | void;
}

export default function FileTable({
  files,
  handleDeleteKBSource,
}: FileTableProps) {
  if (!files?.length) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Uploaded At</TableHead>
              <TableHead>Size (KB)</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <FileIcon className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No Data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Uploaded At</TableHead>
            <TableHead>Size (KB)</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell className="font-medium">
                {file?.data?.fileName}
              </TableCell>
              <TableCell>
                {new Date(file.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {((file?.data?.size || 0) / 1024).toFixed(1)}
              </TableCell>
              <TableCell className="text-center">
                <DeleteConfirmDialog
                  title="Remove File from Knowledge Base"
                  description={`This file will be permanently removed from the knowledge base. This action cannot be undone.`}
                  onConfirm={() => handleDeleteKBSource(file.id, file.kb_id)}
                  trigger={
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
