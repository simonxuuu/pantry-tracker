'use client'
import { Box, Stack, Typography, Button, Modal, TextField, Container, Grid, Card, CardContent, CardActions } from '@mui/material'
import { firestore } from '@/firebase'
import { useEffect, useState } from 'react'
import { collection, query, doc, addDoc, getDoc, deleteDoc, getDocs, updateDoc, setDoc } from 'firebase/firestore'
import React from 'react'

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

export default function Home() {
  const [pantry, setPantry] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [itemQuantity, setItemQuantity] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [editItem, setEditItem] = useState(null)
  const [pantryAddress, setPantryAddress] = useState('')
  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [groupKey, setGroupKey] = useState('')

  useEffect(() => {
    if (pantryAddress) {
      updatePantry()
    }
  }, [pantryAddress])

  const updatePantry = async () => {
    if (!pantryAddress) return;
    const pantryList = [];
    const snapshot = query(collection(firestore, `pantries/${pantryAddress}/items`));
    const docs = await getDocs(snapshot);
    docs.forEach(doc => {
      pantryList.push({ id: doc.id, ...doc.data() });
    });
    setPantry(pantryList);
  };

  const addItem = async () => {
    if (!pantryAddress) return;
    const docRef = await addDoc(collection(firestore, `pantries/${pantryAddress}/items`), { name: itemName, quantity: itemQuantity });
    setPantry(prevPantry => [...prevPantry, { id: docRef.id, name: itemName, quantity: itemQuantity }]);
    setOpen(false);
    setItemName('');
    setItemQuantity(1);
  };

  const removeItem = async (id) => {
    if (!pantryAddress) return;
    await deleteDoc(doc(firestore, `pantries/${pantryAddress}/items`, id));
    setPantry(prevPantry => prevPantry.filter(i => i.id !== id));
  };

  const editItemQuantity = async (id, newQuantity) => {
    if (!pantryAddress) return;
    await updateDoc(doc(firestore, `pantries/${pantryAddress}/items`, id), { quantity: newQuantity });
    setPantry(prevPantry => prevPantry.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const createGroup = async () => {
    const newGroupKey = Math.random().toString(36).substring(2, 8).toUpperCase();
    await setDoc(doc(firestore, 'pantries', newGroupKey), { created: new Date() });
    setPantryAddress(newGroupKey);
    setGroupModalOpen(false);
  };


  const joinGroup = async () => {
    if (groupKey) {
      const groupDocRef = doc(firestore, 'pantries', groupKey);
      const groupDocSnapshot = await getDoc(groupDocRef);
      if (groupDocSnapshot.exists()) {
        setPantryAddress(groupKey);
        setGroupModalOpen(false);
      } else {
        // Handle case when group does not exist
        console.log('Group does not exist');
      }
    }
  };

  const filteredPantry = pantry.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Pantry Items
        </Typography>

        {!pantryAddress ? (
          <Box textAlign="center" my={4}>
            <Button variant="contained" onClick={() => setGroupModalOpen(true)}>
              Create or Join a Pantry Group
            </Button>
          </Box>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Pantry ID: {pantryAddress}
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <TextField
                label="Search Pantry"
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={() => setOpen(true)}
              >
                Add Item
              </Button>
            </Box>

            <Grid container spacing={3}>
              {filteredPantry.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {item.name}
                      </Typography>
                      <Typography color="text.secondary">
                        Quantity: {item.quantity}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small"
                        onClick={() => setEditItem(item)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small"
                        color="error"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Box>

      <Modal
        open={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        aria-labelledby="group-modal"
      >
        <Box sx={modalStyle}>
          <Typography id="group-modal" variant="h6" component="h2" gutterBottom>
            Create or Join a Pantry Group
          </Typography>
          <Button fullWidth variant="contained" onClick={createGroup} sx={{ mb: 2 }}>
            Create New Group
          </Button>
          <Typography variant="subtitle1" gutterBottom>
            Or join an existing group:
          </Typography>
          <TextField
            fullWidth
            label="Group Key"
            variant="outlined"
            value={groupKey}
            onChange={(e) => setGroupKey(e.target.value.toUpperCase())}
            sx={{ mb: 2 }}
          />
          <Button fullWidth variant="contained" onClick={joinGroup} disabled={!groupKey}>
            Join Group
          </Button>
        </Box>
      </Modal>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="add-item-modal"
      >
        <Box sx={modalStyle}>
          <Typography id="add-item-modal" variant="h6" component="h2" gutterBottom>
            Add Item
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="item"
            label="Item Name"
            type="text"
            fullWidth
            variant="outlined"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <TextField
            margin="dense"
            id="quantity"
            label="Quantity"
            type="number"
            fullWidth
            variant="outlined"
            value={itemQuantity}
            onChange={(e) => setItemQuantity(Number(e.target.value))}
            inputProps={{ min: 1 }}
          />
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={addItem}
              disabled={!itemName.trim() || itemQuantity < 1}
            >
              Add
            </Button>
          </Box>
        </Box>
      </Modal>

      <Modal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        aria-labelledby="edit-item-modal"
      >
        <Box sx={modalStyle}>
          <Typography id="edit-item-modal" variant="h6" component="h2" gutterBottom>
            Edit Item Quantity
          </Typography>
          <Typography variant="subtitle1">{editItem?.name}</Typography>
          <TextField
            autoFocus
            margin="dense"
            id="edit-quantity"
            label="New Quantity"
            type="number"
            fullWidth
            variant="outlined"
            value={editItem?.quantity || ''}
            onChange={(e) => setEditItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
            inputProps={{ min: 1 }}
          />
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button onClick={() => setEditItem(null)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={() => {
                editItemQuantity(editItem.id, editItem.quantity);
                setEditItem(null);
              }}
              disabled={editItem?.quantity < 1}
            >
              Update
            </Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  )
}