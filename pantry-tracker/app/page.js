'use client'
import { Box, Stack, Typography, Button, Modal, TextField, Container, Grid, Card, CardContent, CardActions } from '@mui/material'
import { firestore } from '@/firebase'
import { useEffect, useState } from 'react'
import { collection, query, doc, addDoc, deleteDoc, getDocs, updateDoc } from 'firebase/firestore'
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

  useEffect(() => {
    updatePantry()
  }, [])

  const updatePantry = async () => {
    const pantryList = [];
    const snapshot = query(collection(firestore, 'pantry'));
    const docs = await getDocs(snapshot);
    docs.forEach(doc => {
      pantryList.push({ id: doc.id, ...doc.data() });
    });
    setPantry(pantryList);
  };

  const addItem = async () => {
    const docRef = await addDoc(collection(firestore, 'pantry'), { name: itemName, quantity: itemQuantity });
    setPantry(prevPantry => [...prevPantry, { id: docRef.id, name: itemName, quantity: itemQuantity }]);
    setOpen(false);
    setItemName('');
    setItemQuantity(1);
  };

  const removeItem = async (id) => {
    await deleteDoc(doc(firestore, 'pantry', id));
    setPantry(prevPantry => prevPantry.filter(i => i.id !== id));
  };

  const editItemQuantity = async (id, newQuantity) => {
    await updateDoc(doc(firestore, 'pantry', id), { quantity: newQuantity });
    setPantry(prevPantry => prevPantry.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const filteredPantry = pantry.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Public Pantry
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
      </Box>

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