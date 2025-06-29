# Generated by Django 5.1.6 on 2025-05-12 00:57

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("discovery", "0001_initial"),
        ("library", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="featuredshelf",
            name="shelf",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="discovery_features",
                to="library.shelf",
            ),
        ),
    ]

