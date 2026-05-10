router.post('/login', async (req, res) => {

  try {

    console.log('LOGIN HIT');

    const { email, password } = req.body;

    console.log(email);

    // login logic here

  } catch (error) {

    console.error('LOGIN ERROR:', error);

    return res.status(500).json({

      success: false,

      error: error.message
    });
  }
});