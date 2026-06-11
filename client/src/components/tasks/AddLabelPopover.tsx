import { useState } from 'react';
import type { FormEvent, MouseEvent as ReactMouseEvent } from 'react';
import { Box, Button, IconButton, Popover, TextField, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined';
import { PRESET_LABEL_COLORS } from '../../constants';

interface AddLabelPopoverProps {
  onAdd: (name: string, color: string) => Promise<void> | void;
}

// The small label icon on a card that turns into a "+" on hover and opens a
// compact name + preset-color picker.
export default function AddLabelPopover({ onAdd }: AddLabelPopoverProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [hover, setHover] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_LABEL_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const openMenu = (e: ReactMouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchor(e.currentTarget);
  };

  const close = () => {
    setAnchor(null);
    setName('');
    setColor(PRESET_LABEL_COLORS[0]);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onAdd(name.trim(), color);
      close();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Tooltip title="Add label">
        <IconButton
          size="small"
          onClick={openMenu}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          sx={{ p: 0.25 }}
        >
          {hover ? <AddIcon fontSize="small" /> : <LabelOutlinedIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={close}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box component="form" onSubmit={save} sx={{ p: 1.5, width: 220 }}>
          <TextField
            size="small"
            autoFocus
            placeholder="Label name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
            {PRESET_LABEL_COLORS.map((c) => (
              <Box
                key={c}
                onClick={() => setColor(c)}
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  bgcolor: c,
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  border: color === c ? '2px solid #111' : '2px solid transparent',
                }}
              />
            ))}
          </Box>
          <Button type="submit" size="small" variant="contained" fullWidth disabled={saving || !name.trim()}>
            Add label
          </Button>
        </Box>
      </Popover>
    </>
  );
}
