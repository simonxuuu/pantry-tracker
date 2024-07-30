'use client'
import { Box, Stack, Typography, Button, Modal, TextField, Container, Grid, Card, CardContent, CardActions } from '@mui/material'
import { firestore } from '@/firebase'
import { useEffect, useState } from 'react'
import { collection, query, doc, addDoc, getDoc, deleteDoc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore'
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
  const [recipes, setRecipes] = useState([])
  const [open, setOpen] = useState(false)
  const [recipeOpen, setRecipeOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [itemQuantity, setItemQuantity] = useState(1)
  const [recipeName, setRecipeName] = useState('')
  const [recipeIngredients, setRecipeIngredients] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [editItem, setEditItem] = useState(null)
  const [editRecipe, setEditRecipe] = useState(null)
  const [pantryAddress, setPantryAddress] = useState('')
  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [groupKey, setGroupKey] = useState('')

  const savePantryAddress = (address) => {
    localStorage.setItem('pantryAddress', address);
  };

  const loadPantryAddress = () => {
    return localStorage.getItem('pantryAddress');
  };

  const setupRealtimeListener = () => {
    if (!pantryAddress) return;

    const unsubscribePantry = onSnapshot(collection(firestore, `pantries/${pantryAddress}/items`), (snapshot) => {
      const pantryList = [];
      snapshot.forEach((doc) => {
        pantryList.push({ id: doc.id, ...doc.data() });
      });
      setPantry(pantryList);
    });

    const unsubscribeRecipes = onSnapshot(collection(firestore, `pantries/${pantryAddress}/recipes`), (snapshot) => {
      const recipesList = [];
      snapshot.forEach((doc) => {
        recipesList.push({ id: doc.id, ...doc.data() });
      });
      setRecipes(recipesList);
    });

    return () => {
      unsubscribePantry();
      unsubscribeRecipes();
    };
  };

  useEffect(() => {
    const savedAddress = loadPantryAddress();
    if (savedAddress) {
      setPantryAddress(savedAddress);
    }
  }, []);

  useEffect(() => {
    let unsubscribe;
    if (pantryAddress) {
      unsubscribe = setupRealtimeListener();
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [pantryAddress]);

  const addItem = async () => {
    if (!pantryAddress) return;
    await addDoc(collection(firestore, `pantries/${pantryAddress}/items`), { name: itemName, quantity: itemQuantity });
    setOpen(false);
    setItemName('');
    setItemQuantity(1);
  };

  const removeItem = async (id) => {
    if (!pantryAddress) return;
    await deleteDoc(doc(firestore, `pantries/${pantryAddress}/items`, id));
  };

  const editItemQuantity = async (id, newQuantity) => {
    if (!pantryAddress) return;
    await updateDoc(doc(firestore, `pantries/${pantryAddress}/items`, id), { quantity: newQuantity });
  };

  const createGroup = async () => {
    const newGroupKey = Math.random().toString(36).substring(2, 8).toUpperCase();
    await setDoc(doc(firestore, 'pantries', newGroupKey), { created: new Date() });
    setPantryAddress(newGroupKey);
    savePantryAddress(newGroupKey);
    setGroupModalOpen(false);
  };

  const joinGroup = async () => {
    if (groupKey) {
      const groupDocRef = doc(firestore, 'pantries', groupKey);
      const groupDocSnapshot = await getDoc(groupDocRef);
      if (groupDocSnapshot.exists()) {
        setPantryAddress(groupKey);
        savePantryAddress(groupKey);
        setGroupModalOpen(false);
      } else {
        console.log('Group does not exist');
      }
    }
  };

  const leaveGroup = () => {
    setPantryAddress('');
    savePantryAddress('');
  };

  const addRecipe = async () => {
    if (!pantryAddress) return;
    await addDoc(collection(firestore, `pantries/${pantryAddress}/recipes`), { name: recipeName, ingredients: recipeIngredients.split(',').map(item => item.trim()) });
    setRecipeOpen(false);
    setRecipeName('');
    setRecipeIngredients('');
  };

  const removeRecipe = async (id) => {
    if (!pantryAddress) return;
    await deleteDoc(doc(firestore, `pantries/${pantryAddress}/recipes`, id));
  };

  const editRecipeDetails = async (id, name, ingredients) => {
    if (!pantryAddress) return;
    await updateDoc(doc(firestore, `pantries/${pantryAddress}/recipes`, id), { name, ingredients: ingredients.split(',').map(item => item.trim()) });
    setEditRecipe(null);
  };

  const filteredPantry = pantry.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Pantry Items & Recipes
        </Typography>

        {!pantryAddress ? (
          <Box textAlign="center" my={4}>
            <Button variant="contained" onClick={() => setGroupModalOpen(true)}>
              Create or Join a Pantry Group
            </Button>
          </Box>
        ) : (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Typography variant="h6">
                Pantry ID: {pantryAddress}
              </Typography>
              <Button variant="outlined" color="secondary" onClick={leaveGroup}>
                Leave Group
              </Button>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <TextField
                label="Search Pantry"
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="contained" onClick={() => setOpen(true)}>
                Add Item
              </Button>
            </Box>

            <Typography variant="h5" component="h2" gutterBottom>
              Pantry Items
            </Typography>
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
                      <Button size="small" onClick={() => setEditItem(item)}>
                        Edit
                      </Button>
                      <Button size="small" color="error" onClick={() => removeItem(item.id)}>
                        Remove
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box display="flex" justifyContent="space-between" alignItems="center" mt={4} mb={2}>
              <TextField
                label="Search Recipes"
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="contained" onClick={() => setRecipeOpen(true)}>
                Add Recipe
              </Button>
            </Box>

            <Typography variant="h5" component="h2" gutterBottom>
              Recipes
            </Typography>
            <Grid container spacing={3}>
              {filteredRecipes.map((recipe) => (
                <Grid item xs={12} sm={6} md={4} key={recipe.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {recipe.name}
                      </Typography>
                      <Typography color="text.secondary">
                        Ingredients: {recipe.ingredients.join(', ')}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" onClick={() => setEditRecipe(recipe)}>
                        Edit
                      </Button>
                      <Button size="small" color="error" onClick={() => removeRecipe(recipe.id)}>
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
        open={recipeOpen}
        onClose={() => setRecipeOpen(false)}
        aria-labelledby="add-recipe-modal"
      >
        <Box sx={modalStyle}>
          <Typography id="add-recipe-modal" variant="h6" component="h2" gutterBottom>
            Add Recipe
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="recipe"
            label="Recipe Name"
            type="text"
            fullWidth
            variant="outlined"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
          />
          <TextField
            margin="dense"
            id="ingredients"
            label="Ingredients (comma separated)"
            type="text"
            fullWidth
            variant="outlined"
            value={recipeIngredients}
            onChange={(e) => setRecipeIngredients(e.target.value)}
          />
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button onClick={() => setRecipeOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={addRecipe}
              disabled={!recipeName.trim() || !recipeIngredients.trim()}
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

      <Modal
        open={!!editRecipe}
        onClose={() => setEditRecipe(null)}
        aria-labelledby="edit-recipe-modal"
      >
        <Box sx={modalStyle}>
          <Typography id="edit-recipe-modal" variant="h6" component="h2" gutterBottom>
            Edit Recipe
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="recipe-name"
            label="Recipe Name"
            type="text"
            fullWidth
            variant="outlined"
            value={editRecipe?.name || ''}
            onChange={(e) => setEditRecipe(prev => ({ ...prev, name: e.target.value }))}
          />
          <TextField
            margin="dense"
            id="recipe-ingredients"
            label="Ingredients (comma separated)"
            type="text"
            fullWidth
            variant="outlined"
            value={editRecipe?.ingredients.join(', ') || ''}
            onChange={(e) => setEditRecipe(prev => ({ ...prev, ingredients: e.target.value.split(',').map(item => item.trim()) }))}
          />
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button onClick={() => setEditRecipe(null)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={() => {
                editRecipeDetails(editRecipe.id, editRecipe.name, editRecipe.ingredients);
                setEditRecipe(null);
              }}
              disabled={!editRecipe?.name.trim() || !editRecipe?.ingredients.length}
            >
              Update
            </Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  )
}
