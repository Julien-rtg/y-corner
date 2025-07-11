import { Category } from "./Category.interface";
import { Image } from "./Image.interface";
import { User } from "./User.interface";

export interface Equipment {
    id: number;
    name: string;
    categories: Category[];
    city: string;
    price: number;
    images: Image[];
    user: User;
    description: string;
    isFavorite?: boolean;
}