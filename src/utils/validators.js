export const validateLoginForm = (email, password) => {
  const errors = {};

  if (!email || !email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password || !password.trim()) {
    errors.password = 'Password is required';
  } else if (password.length < 1) {
    errors.password = 'Password must be at least 1 character';
  }

  return errors;
};

export const validateRegisterForm = (email, password, fullName) => {
  const errors = {};

  if (!fullName || !fullName.trim()) {
    errors.fullName = 'Full name is required';
  }

  if (!email || !email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password || !password.trim()) {
    errors.password = 'Password is required';
  } else if (!isStrongPassword(password)) {
    errors.password = 'Password must be at least 8 characters';
  }

  return errors;
};

export const validateTicketForm = (title, description, priority) => {
  const errors = {};

  if (!title || !title.trim()) {
    errors.title = 'Title is required';
  }

  if (!description || !description.trim()) {
    errors.description = 'Description is required';
  }

  if (!priority) {
    errors.priority = 'Priority is required';
  }

  return errors;
};

export const validateCommentForm = (content) => {
  const errors = {};

  if (!content || !content.trim()) {
    errors.content = 'Comment cannot be empty';
  }

  return errors;
};

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isStrongPassword = (password) => {
  return password && password.length >= 8;
};