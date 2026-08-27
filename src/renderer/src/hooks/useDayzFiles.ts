import { useState, useEffect, useCallback } from 'react'
import { useServerStore } from '../store/useServerStore'

export interface FileEntry {
  name: string
  isDirectory: boolean
  size: number
  mtime: string
}

export function useDayzFiles() {
  const { activeServerId } = useServerStore()
  const [currentPath, setCurrentPath] = useState<string>('')
  const [files, setFiles] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [editingFile, setEditingFile] = useState<{ path: string; content: string } | null>(null)
  const [newFolderName, setNewFolderName] = useState<string | null>(null)

  const fetchDir = useCallback(
    async (path: string) => {
      setLoading(true)
      try {
        const res = await window.api.fs.listDir(activeServerId, path)
        setFiles(res)
        setCurrentPath(path)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    },
    [activeServerId]
  )

  useEffect(() => {
    fetchDir('')
  }, [fetchDir])

  const handleNavigate = (path: string) => {
    fetchDir(path)
  }

  const handleNavigateUp = () => {
    const parts = currentPath.split(/\\|\//).filter(Boolean)
    parts.pop()
    fetchDir(parts.join('/'))
  }

  const handleFileClick = async (file: FileEntry) => {
    const fullPath = currentPath ? `${currentPath}/${file.name}` : file.name
    if (file.isDirectory) {
      handleNavigate(fullPath)
    } else {
      const editableExts = ['.txt', '.json', '.cfg', '.xml', '.yaml', '.yml', '.log']
      const isEditable = editableExts.some((ext) => file.name.toLowerCase().endsWith(ext))

      if (isEditable || file.size < 1024 * 1024) {
        try {
          const content = await window.api.fs.readFile(activeServerId, fullPath)
          setEditingFile({ path: fullPath, content })
        } catch (e) {
          alert('Could not read file')
        }
      } else {
        alert('File type not supported for editing or too large.')
      }
    }
  }

  const handleDelete = async (e: React.MouseEvent, file: FileEntry) => {
    e.stopPropagation()
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return

    const fullPath = currentPath ? `${currentPath}/${file.name}` : file.name
    try {
      await window.api.fs.deleteItem(activeServerId, fullPath)
      fetchDir(currentPath)
    } catch (e) {
      alert('Failed to delete item')
    }
  }

  const handleSaveFile = async () => {
    if (!editingFile) return
    try {
      await window.api.fs.writeFile(activeServerId, editingFile.path, editingFile.content)
      alert('File saved successfully!')
      setEditingFile(null)
    } catch (e) {
      alert('Failed to save file')
    }
  }

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName) return

    const fullPath = currentPath ? `${currentPath}/${newFolderName}` : newFolderName
    try {
      await window.api.fs.createFolder(activeServerId, fullPath)
      setNewFolderName(null)
      fetchDir(currentPath)
    } catch (e) {
      alert('Failed to create folder')
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return {
    currentPath,
    files,
    loading,
    editingFile,
    setEditingFile,
    newFolderName,
    setNewFolderName,
    handleNavigate,
    handleNavigateUp,
    handleFileClick,
    handleDelete,
    handleSaveFile,
    handleCreateFolder,
    formatSize
  }
}
