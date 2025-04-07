
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MachineType } from "@/hooks/useMachineTypes";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useImageUpload } from "@/hooks/use-image-upload";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Loader2, Trash2, XCircle } from "lucide-react";

interface MachineTypeModalProps {
  open: boolean;
  onClose: () => void;
  machine?: MachineType | null;
  onSave: () => void;
}

const MachineTypeModal: React.FC<MachineTypeModalProps> = ({
  open,
  onClose,
  machine,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isPhotoDeleting, setIsPhotoDeleting] = useState(false);
  
  const { 
    previewUrl, 
    fileInputRef, 
    handleThumbnailClick, 
    handleFileChange,
    handleRemove,
    setPreviewUrl,
    isUploading 
  } = useImageUpload(machine?.photo_url);

  useEffect(() => {
    if (machine) {
      setName(machine.name || "");
      setDescription(machine.description || "");
      setPreviewUrl(machine.photo_url);
    } else {
      setName("");
      setDescription("");
      setPreviewUrl(null);
    }
  }, [machine, setPreviewUrl]);

  const handleDeletePhoto = async () => {
    if (!machine?.photo_url) return;

    try {
      setIsPhotoDeleting(true);
      
      // Extract filename from URL
      const fileName = machine.photo_url.split('/').pop();
      
      if (fileName) {
        // Delete from storage
        const { error: deleteError } = await supabase.storage
          .from('machine_images')
          .remove([fileName]);
          
        if (deleteError) {
          console.error("Error deleting image from storage:", deleteError);
          throw deleteError;
        }
      }
      
      // Update machine record to remove photo_url
      const { error: updateError } = await supabase
        .from('machine_types')
        .update({ photo_url: null })
        .eq('machine_type_id', machine.machine_type_id);
        
      if (updateError) {
        console.error("Error updating machine record:", updateError);
        throw updateError;
      }
      
      // Clear preview
      setPreviewUrl(null);
      toast.success("Photo deleted successfully");
      
    } catch (error: any) {
      console.error("Error deleting photo:", error);
      toast.error(error.message || "Failed to delete photo");
    } finally {
      setIsPhotoDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Machine name is required");
      return;
    }

    try {
      setIsSaving(true);

      if (machine) {
        // Update existing machine
        const { error } = await supabase
          .from("machine_types")
          .update({
            name,
            description,
            photo_url: previewUrl,
          })
          .eq("machine_type_id", machine.machine_type_id);

        if (error) {
          console.error("Error updating machine type:", error);
          throw error;
        }
        toast.success("Machine type updated successfully");
      } else {
        // Create new machine
        const { error } = await supabase.from("machine_types").insert({
          name,
          description,
          photo_url: previewUrl,
        });

        if (error) {
          console.error("Error creating machine type:", error);
          throw error;
        }
        toast.success("Machine type created successfully");
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error("Error saving machine type:", error);
      toast.error(error.message || "Failed to save machine type");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!machine) return;

    try {
      setIsDeleting(true);

      // Delete the machine type
      const { error } = await supabase
        .from("machine_types")
        .delete()
        .eq("machine_type_id", machine.machine_type_id);

      if (error) throw error;

      // Delete the image from storage if it exists
      if (machine.photo_url) {
        const fileName = machine.photo_url.split("/").pop();
        if (fileName) {
          await supabase.storage
            .from("machine_images")
            .remove([fileName]);
        }
      }

      toast.success("Machine type deleted successfully");
      onSave();
      onClose();
      setConfirmDeleteOpen(false);
    } catch (error: any) {
      console.error("Error deleting machine type:", error);
      toast.error(error.message || "Failed to delete machine type");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle>
              {machine ? "Edit Machine Type" : "Add New Machine Type"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-white">Name</Label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="p-2 rounded-md bg-slate-800 border border-slate-700 text-slate-100 outline-none focus:border-blue-500"
                placeholder="Enter machine name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-white">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="p-2 rounded-md bg-slate-800 border border-slate-700 text-slate-100 outline-none focus:border-blue-500 min-h-[100px]"
                placeholder="Enter machine description"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-white">Machine Photo</Label>
              <div className="relative">
                <AspectRatio ratio={1} className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-md overflow-hidden">
                  {previewUrl ? (
                    <>
                      <img
                        src={previewUrl}
                        alt="Machine preview"
                        className="object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 bg-red-900/80 p-1 rounded-full hover:bg-red-800 transition-colors"
                      >
                        <XCircle className="h-5 w-5 text-white" />
                      </button>
                      {machine?.photo_url && previewUrl === machine.photo_url && (
                        <button
                          type="button"
                          onClick={handleDeletePhoto}
                          disabled={isPhotoDeleting}
                          className="absolute top-2 left-2 bg-red-900/80 p-1 rounded-full hover:bg-red-800 transition-colors"
                        >
                          {isPhotoDeleting ? (
                            <Loader2 className="h-5 w-5 text-white animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5 text-white" />
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center h-full cursor-pointer"
                      onClick={handleThumbnailClick}
                    >
                      <p className="text-slate-400 text-center">
                        Click to upload an image
                      </p>
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                    </div>
                  )}
                </AspectRatio>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            {machine && (
              <Button
                variant="destructive"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={isDeleting || isSaving}
                className="mr-auto"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Machine"
                )}
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || isUploading}
              className="bg-blue-700 hover:bg-blue-800"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone. This will permanently delete the
              machine type and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-slate-100 border-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-700 hover:bg-red-800 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MachineTypeModal;
