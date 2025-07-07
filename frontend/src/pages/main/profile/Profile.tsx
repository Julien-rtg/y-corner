import { useState, useEffect } from 'react';
import { User } from '@/interfaces/User.interface';
import { getUser } from '@/utils/getToken';
import userService, { UserUpdateData } from '@/services/user/user';
import { toast } from 'sonner';
import { AuthentificationService } from '@/services/authentification/authentification';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [formData, setFormData] = useState<UserUpdateData>({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    country: '',
    postalCode: undefined,
    birthDate: '',
  });

  const navigate = useNavigate();
  const auth = new AuthentificationService();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const currentUser = getUser();
        if (!currentUser || !currentUser.id) {
          toast.error('Utilisateur non connecté');
          navigate('/login');
          return;
        }

        const userData = await userService.getUserDetails(currentUser.id);
        setUser(userData);

        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          address: userData.address || '',
          city: userData.city || '',
          country: userData.country || '',
          postalCode: userData.postalCode,
          birthDate: userData.birthDate ? new Date(userData.birthDate).toISOString().split('T')[0] : '',
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
        toast.error('Impossible de récupérer vos informations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: value ? parseInt(value, 10) : undefined,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      setIsLoading(true);
      const updatedUser = await userService.updateUser(user.id, formData);
      setUser(updatedUser);
      setIsEditing(false);
      toast.success('Profil mis à jour avec succès');

      const storedUser = getUser();
      localStorage.setItem('user', JSON.stringify({
        ...storedUser,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        address: updatedUser.address,
        city: updatedUser.city,
        country: updatedUser.country,
        postalCode: updatedUser.postalCode,
      }));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast.error('Impossible de mettre à jour votre profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      await userService.deleteUser(user.id);
      toast.success('Votre compte a été supprimé');
      auth.logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      toast.error('Impossible de supprimer votre compte');
      setIsLoading(false);
      setShowDeleteConfirmation(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Mon Profil</h1>

        {isLoading && (
          <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!isEditing && !isLoading && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Informations personnelles</h2>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Modifier
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-600 mb-1">Prénom</p>
                <p className="font-medium">{user?.firstName}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Nom</p>
                <p className="font-medium">{user?.lastName}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Date de naissance</p>
                <p className="font-medium">
                  {user?.birthDate ? new Date(user.birthDate).toLocaleDateString('fr-FR') : 'Non renseignée'}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Adresse</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 mb-1">Adresse</p>
                  <p className="font-medium">{user?.address || 'Non renseignée'}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Ville</p>
                  <p className="font-medium">{user?.city || 'Non renseignée'}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Code postal</p>
                  <p className="font-medium">{user?.postalCode || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Pays</p>
                  <p className="font-medium">{user?.country || 'Non renseigné'}</p>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowDeleteConfirmation(true)}
                className="text-red-500 hover:text-red-600 font-medium"
              >
                Supprimer mon compte
              </button>
            </div>
          </div>
        )}
        {isEditing && !isLoading && (
          <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Modifier mes informations</h2>
              <div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md transition-colors mr-2"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-gray-700 mb-1">Prénom</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="birthDate" className="block text-gray-700 mb-1">Date de naissance</label>
                <input
                  type="date"
                  id="birthDate"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Adresse</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="address" className="block text-gray-700 mb-1">Adresse</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-gray-700 mb-1">Ville</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="postalCode" className="block text-gray-700 mb-1">Code postal</label>
                  <input
                    type="number"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode || ''}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="country" className="block text-gray-700 mb-1">Pays</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Modal de confirmation de suppression */}
        {showDeleteConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Confirmer la suppression</h3>
              <p className="mb-6">Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;