

import django.db.models.deletion


from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [

        ('library', 'remove_old_journal_entry'),

    ]

    operations = [
        migrations.CreateModel(
            name='FeaturedShelf',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('display_title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('display_order', models.IntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('display_type', models.CharField(choices=[('CAROUSEL', 'Horizontal Carousel'), ('GRID', 'Grid Layout'), ('HERO', 'Hero Banner')], default='CAROUSEL', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('shelf', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='discovery_features', to='library.shelf')),
"""
  This was in a fei's branch i think. I dont know what it does, but I'll leave it here
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("display_title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("display_order", models.IntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                (
                    "display_type",
                    models.CharField(
                        choices=[
                            ("CAROUSEL", "Horizontal Carousel"),
                            ("GRID", "Grid Layout"),
                            ("HERO", "Hero Banner"),
                        ],
                        default="CAROUSEL",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "shelf",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="discovery_features",
                        to="library.shelf",
                    ),
                ),
"""
            ],
            options={
                'ordering': ['display_order', 'created_at'],
            },
        ),
    ]
